/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search','N/record'],
    
    (search,record) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {

            return search.create({
                type: "salesorder",
                filters:
                    [
                        ["type","anyof","SalesOrd"],
                        "AND",
                        ["status","anyof","SalesOrd:D","SalesOrd:E","SalesOrd:B"],
                        "AND",
                        ["fulfillingtransaction.status","noneof","FftReq:I","FftReq:D"]
                        // ["item.type","anyof","NonInvtPart","Service"],
                        // "AND",
                        // ["formulatext: case when {quantityshiprecv} = {quantity} THEN '0' ELSE '1' END","is","1"]
                    ],
                columns:
                    [
                        "entity"
                        // search.createColumn({name: "entity", label: "Name"}),
                        // search.createColumn({name: "statusref", label: "Status"}),
                        // search.createColumn({name: "tranid", label: "Document Number"}),
                        // search.createColumn({name: "item", label: "Item"}),
                        // search.createColumn({name: "quantityshiprecv", label: "Quantity Fulfilled/Received"}),
                        // search.createColumn({name: "quantity", label: "Quantity"}),
                        // search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
            });
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
            var searchResult = JSON.parse(mapContext.value);
            var SalesId = searchResult.id;
            //log.debug(SalesId)

            mapContext.write({
                key: SalesId,
                value: SalesId
            });
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        var locationitem1=[];
        const reduce = (reduceContext) => {
            var salesorderid = reduceContext.key;
            var salesorder = record.load({
                type: record.Type.SALES_ORDER,
                id: salesorderid,
                isDynamic: true
            });

            var numlines=salesorder.getLineCount({
                sublistId:'item'
            });
            var item_name_quantity_fulfill=new Array(numlines);
            var item_name_quantity=new Array(numlines);
            var item_name=new Array(numlines);
            var item_type=new Array(numlines);
            var item_type_location=new Array(numlines);
            var locationitem=[];

            var test_item=[];
            var countitem=0;
            var countnoninv=0;
            for(var i=0;i<numlines;i++) {

                item_name[i] = salesorder.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                })

                if(item_name[i]!=0){

                    item_name_quantity[i] = salesorder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    })
                    //log.debug({title: 'item_name_quantity', details: item_name_quantity[i]});
                    item_name_quantity_fulfill[i] = salesorder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantityfulfilled',
                        line: i
                    })
                    //log.debug({title: 'item_name_quantity_fulfill', details: item_name_quantity_fulfill[i]});


                    if(item_name_quantity[i]==item_name_quantity_fulfill[i]){
                        log.debug("fulfilled");

                    }
                    else{

                        countitem=countitem+1;
                        item_type[i] = salesorder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype',
                            line: i
                        })
                        if(item_type[i]=='NonInvtPart' || item_type[i]=='Service'){

                           countnoninv=countnoninv+1;
                            item_type_location[i] = salesorder.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                line: i
                            })
                            log.debug("item_type_location[i]",item_type_location[i]);

                            locationitem.push(item_type_location[i]);


                            log.debug("item_name_for_location[i]",item_name[i]);
                            test_item.push(item_name[i])
            }

                    }
                }

            }

            if(countitem==countnoninv){

                var need_to_fulfill=salesorder.id;


                try {
                    log.debug("locationitem", locationitem.length);




                         var fulfillment = record.transform({
                             fromType: record.Type.SALES_ORDER,
                             fromId: need_to_fulfill,
                             toType: record.Type.ITEM_FULFILLMENT,
                             isDynamic: false
                         });
                    var lineCount = fulfillment.getLineCount({
                        sublistId: 'item'
                    });

                    for (var j = 0; j < lineCount; j++) {

                        fulfillment.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemreceive',
                            line: j,
                            value: true
                        });

                    }

                    fulfillment.setValue({fieldId: 'custbody_jj_training_fulfill_cdus2063', value: true});
                    fulfillment.setValue({fieldId: 'shipstatus', value: 'C'});

                    var rid = fulfillment.save();
                    log.debug("fulfillment", rid);




                }catch (e) {

                    log.debug("e.message"+salesorder.id,e.message);


log.debug("error location of item",locationitem);
                    log.debug("error location of item length",locationitem.length);

     for(var t=0;t<locationitem.length;t++){
         log.debug("item_name[t]",item_name[t]);
             var fulfillment1 = record.transform({
        fromType: record.Type.SALES_ORDER,
        fromId: salesorder.id,
        toType: record.Type.ITEM_FULFILLMENT,
        isDynamic: false,

    });
             //log.debug("transform");
         for (var p = 0; p < 1; p++) {

             fulfillment1.setSublistValue({
                 sublistId: 'item',
                 fieldId: 'itemreceive',
                 line: p,
                 value: true
             });
             //log.debug("itemreceive");
             fulfillment1.setSublistValue({
                 sublistId: 'item',
                 fieldId: 'item',
                 line: p,
                 value: item_name[t]
             });
             //log.debug("item");
             fulfillment1.setSublistValue({
                 sublistId: 'item',
                 fieldId: 'location',
                 line: p,
                 value: locationitem[t]
             });

         }

         fulfillment1.setValue({fieldId: 'custbody_jj_training_fulfill_cdus2063', value: true});
         //log.debug("custbody_jj_training_fulfill_cdus2063");
         fulfillment1.setValue({fieldId: 'shipstatus', value: 'C'});
         log.debug("shipstatus");

         var rid1 = fulfillment1.save();
         log.debug("fulfillment1", rid1);

     }
                }

            }



        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */

        return {getInputData,map, reduce}

    });
