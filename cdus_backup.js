/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
/******************************************************************************************
 * Script Description
 * Create auto matic Item fulfillments for the historical sales orders.
 */
/******************************************************************************************
 * CORP DESIGN | CDUS-2063 | Auto Item Fulfillments
 ******************************************************************************************
 * 
 * Date: 29/12/2022
 * 
 * Author: Gopika, Jobin & Jismi IT Services
 * 
 * REVISION HISTORY
 *  
 *******************************************************************************************/
 define(['N/search', 'N/record', 'N/file', 'N/email'], (search, record, file, email) => {
    let skipItems = { "EndGroup": "EndGroup", "Group": "Group" };
    let serviceAndNonInv = { "NonInvtPart": "NonInvtPart", "Service": "Service" };
    /**
     * This function getting all items from the sales orders
     * @retun object
     */
    const getItemsInOrder = (salesorderId) => {
        try {
            let salesItemArray = search.create({
                type: "salesorder",
                filters:
                    [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["status", "anyof", "SalesOrd:E", "SalesOrd:D", "SalesOrd:B"],
                        "AND",
                        ["item.type", "noneof", "Description", "Discount", "Markup", "OthCharge", "Payment", "Subtotal"],
                        "AND",
                        ["internalid", "anyof", salesorderId],
                        "AND",
                        ["closed","is","F"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "quantity", label: "Quantity" }),
                        search.createColumn({ name: "quantitypicked", label: "Quantity Picked" }),
                        search.createColumn({ name: "quantityshiprecv", label: "Quantity Fulfilled/Received" }),
                        search.createColumn({ name: "type", join: "item", label: "Type" }),
                        search.createColumn({ name: "location", label: "Location" }),
                        search.createColumn({ name: "internalid", join: "item", label: "Internal ID" })
                    ]
            });
            let itemArrayCount = salesItemArray.runPaged().count;
            if (itemArrayCount == 0) return [];
            let itemArray = [];
            salesItemArray.run().each(function (result) {
                let itemObj = {};
                itemObj.soId = result.getValue({ name: "internalid", label: "Internal ID" });
                itemObj.quantity = result.getValue({ name: "quantity", label: "Quantity" }) || 0;
                itemObj.picked = result.getValue({ name: "quantitypicked", label: "Quantity Picked" });
                itemObj.fulfilled = result.getValue({ name: "quantityshiprecv", label: "Quantity Fulfilled/Received" });
                itemObj.itemType = result.getValue({ name: "type", join: "item", label: "Type" });
                itemObj.location = result.getValue({ name: "location", label: "Location" });
                itemObj.itemId = result.getValue({ name: "internalid", join: "item", label: "Internal ID" });
                itemArray.push(itemObj);
                return true;
            });
            return { "status": true, "itemArray": itemArray, "errorMsg": "" };
        } catch (error) {
            log.debug("error @ getItemsInOrder", error);
            return { "status": false, "itemArray": itemArray, "errorMsg": error.message };
        }
    }
    /**
     * This function perform identifing the pending non-inventory item and service item for fulfill
     * Check all other items type are fulfilled in the order.
     * @retun object
     */
    const fulfilledArrayConst = (itemArray) => {
        try {
            let nonInvItemCount = false;
            let invItemCount = false;
            let nonInvArray = [];
            let locationArray = [];
            for (let i = 0; i < itemArray.length; i++) {
                if (skipItems[itemArray[i]['itemType']]) {
                    continue
                }
                if (serviceAndNonInv[itemArray[i]['itemType']]) {
                    if (Number(itemArray[i]['quantity']) != Number(itemArray[i]['picked'])) {
                        locationArray.push(itemArray[i]['location']);
                        nonInvArray.push(itemArray[i]);
                        nonInvItemCount = true;
                    }
                } else {
                    if (Number(itemArray[i]['quantity']) != Number(itemArray[i]['fulfilled'])) {
                        invItemCount = true;
                    }
                }
            }
            return { "status": true, "errorMsg": "", "nonInvItemCount": nonInvItemCount, "invItemCount": invItemCount, "nonInvArray": nonInvArray, "locationArray": [...new Set(locationArray)] };
        } catch (error) {
            log.debug("error @ fulfilledArrayConst", error);
            return { "status": false, "errorMsg": error.message, "nonInvItemCount": false, "invItemCount": false, "nonInvArray": [], "locationArray": [] }
        }
    }
    /**
     * Item fulfillment action perform
     * Based on the loaction create multiple if from same sales order.
     * @since 2015.2
     */
    const createIfRec = (salesorderId, tobeFulfilled) => {
        try {
            let locationArray = tobeFulfilled['locationArray'];
            let ifIdArray = [];
            for (let count = 0; count < locationArray.length; count++) {
                let needToSave = false;
                let fulfillmentRec = record.transform({ fromType: record.Type.SALES_ORDER, fromId: salesorderId, toType: record.Type.ITEM_FULFILLMENT, isDynamic: false });
                let fulfillLineCount = fulfillmentRec.getLineCount({ sublistId: 'item' });
                for (let j = 0; j < fulfillLineCount; j++) {
                    if (locationArray[count] == fulfillmentRec.getSublistValue({ sublistId: 'item', fieldId: 'location', line: j }) && serviceAndNonInv[fulfillmentRec.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: j })]) {
                        fulfillmentRec.setSublistValue({ sublistId: 'item', fieldId: 'itemreceive', line: j, value: true });
                        needToSave = true;
                    }
                }
                if (needToSave) {
                    fulfillmentRec.setValue({ fieldId: 'custbody_jj_training_fulfill_cdus2063', value: true });
                    fulfillmentRec.setValue({ fieldId: 'shipstatus', value: 'C' });
                    let ifId = fulfillmentRec.save({ enableSourcing: true, ignoreMandatoryFields: true });
                    log.debug('ifId********************', ifId)
                    ifIdArray.push(ifId)
                }
            }
            return { "status": true, "salesOrd": salesorderId, "ifArr": ifIdArray, "errorMsg": "" }
        } catch (error) {
            log.debug("error @ createIfRec", error);
            return { "status": false, "salesOrd": salesorderId, "ifArr": [], "errorMsg": error.message }
        }
    }

    /**
     * Getting the sales orders from the Netsuite and reurn to reduce
     * @since 2015.2
     */
    const getInputData = (inputContext) => {
        try {
            return search.create({
                type: "salesorder",
                filters:
                    [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["status", "anyof", "SalesOrd:E", "SalesOrd:D", "SalesOrd:B"],
                        "AND",
                        ["formulanumeric: CASE WHEN {quantity} != {quantitypicked} THEN 0 ELSE 1 END", "equalto", "0"],
                        "AND",
                        ["item.type", "anyof", "NonInvtPart", "Service"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                    ]
            });
        } catch (error) {
            log.debug("error @ getInputData", error);
            return [];
        }

    }

    /**
     * Process the sales orders one by one in the reduce function
     * @since 2015.2
     */

    const reduce = (reduceContext) => {
        try {
            log.debug('reduceContext', reduceContext);
            let resultValue = JSON.parse(reduceContext.values);
            let salesorderId = resultValue["values"]["GROUP(internalid)"]["value"];
            log.debug('salesorderId', salesorderId)
            if (!salesorderId) return false;
            let itemArray = getItemsInOrder(salesorderId);
            log.debug('itemArray', itemArray);
            if (!itemArray['status']) {
                reduceContext.write({ key: "salesorderId", value: salesorderId + "," + itemArray['errorMsg'] + "\r\n" });
            }
            if (itemArray['itemArray'].length < 1) return false;
            let tobeFulfilled = fulfilledArrayConst(itemArray['itemArray']);
            log.debug('tobeFulfilled', tobeFulfilled)
            if (!tobeFulfilled['status']) {
                reduceContext.write({ key: "salesorderId", value: salesorderId + "," + tobeFulfilled['errorMsg'] + "\r\n" });
            }
            if (tobeFulfilled["nonInvItemCount"] && !tobeFulfilled["invItemCount"]) {
                log.debug("tobeFulfilled", tobeFulfilled);
                let createIfRecRes = createIfRec(salesorderId, tobeFulfilled);
                log.debug('createIfRecRes', createIfRecRes);
                if (!createIfRecRes['status']) {
                    reduceContext.write({ key: "salesorderId", value: salesorderId + "," + createIfRecRes['errorMsg'] + "\r\n" });
                }
            }
        } catch (error) {
            log.debug("error @ reduce", error);
            reduceContext.write({ key: "salesorderId", value: salesorderId + "," + error.message + "\r\n" });
        }

    }

    const summarize = (summaryContext) => {
        try {
            let csvFileData = "Sales OrderId, Error Message\r\n"
            let errorCount = 0;
            summaryContext.output.iterator().each(function (key, value) {
                csvFileData += value.toString();
                errorCount++;
                return true;
            });
            if (errorCount > 0) {
                let csvFileCreate = file.create({
                    name: 'Auto Fulfillment Errors' + Date.now() + '.csv',
                    fileType: file.Type.CSV,
                    contents: csvFileData
                });
                csvFileCreate.folder = 298510;
                email.send({
                    author: -5,
                    recipients: -5,
                    subject: 'Auto Fulfillment Errors',
                    body: 'This file created from last Auto fulfillment script exceution',
                    attachments: [csvFileCreate],
                    relatedRecords: {
                        entityId: -5
                    }
                });
                let fileId = csvFileCreate.save();
                log.debug('fileId', fileId)
            }
        } catch (error) {
            log.debug("error @ summarize", error);
        }

    }
    return { getInputData, reduce, summarize }
});