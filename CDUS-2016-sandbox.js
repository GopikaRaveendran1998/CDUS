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
        var recEmail = nlapiCreateRecord("customrecordcustomrecord_email");
        recEmail.setFieldValue('custrecordemail_from',fromAddress);
        recEmail.setFieldValue('custrecordemail_to',toAddress);
        recEmail.setFieldValue('custrecordemail_subject',emailsubject);
        recEmail.setFieldValue('custrecordemail_body',emailBody);

        nlapiSubmitRecord(recEmail); 
        
    }catch(e){
        nlapiLogExecution('debug','error passingdata',e);
    }
}
