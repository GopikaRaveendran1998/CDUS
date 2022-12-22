try{
    function process(email)
    {
        var fromAddress=email.getFrom().getEmail();
        nlapiLogExecution('debug', 'From Email Address', fromAddress);
        var toAddress=email.getTo();
        var arryofTo=[];
        for(var i in toAddress)
        {
            nlapiLogExecution('debug','To Email Address',toAddress[i].getEmail());
            arryofTo.push(toAddress[i].getEmail());
        }
        nlapiLogExecution('debug','arryofTo',JSON.stringify(arryofTo));
        var emailBody=email.getTextBody();
        nlapiLogExecution('debug', 'Email Body', emailBody);
        var emailsubject=email.getSubject();
        nlapiLogExecution('debug','Email Subject',emailsubject)
    var funpass=passingdata(fromAddress,toAddress,emailBody,emailsubject);
        
    }
}catch(e){
    nlapiLogExecution('debug','error message',e);
}

function passingdata(fromAddress,toAddress,emailBody,emailsubject){
    try{
        var recEmail = nlapiCreateRecord("customrecord_jj_corp_material");
        recEmail.setFieldValue('custrecord_jj_corp_material_from',fromAddress);
        recEmail.setFieldValue('custrecord_jj_corp_material_to',toAddress);
        recEmail.setFieldValue('custrecord_jj_corp_material_subject',emailsubject);
        recEmail.setFieldValue('custrecord_jj_corp_material_body',emailBody);

        nlapiSubmitRecord(recEmail); 
        
    }catch(e){
        nlapiLogExecution('debug','error passingdata',e);
    }
}
