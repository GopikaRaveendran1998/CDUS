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
        var recEmail = nlapiCreateRecord("customrecord_jj_cdus_2016_outbound");
        recEmail.setFieldValue('custrecord_jj_from_outbound',fromAddress);
        recEmail.setFieldValue('custrecord_jj_from_outbound_',toAddress);
        recEmail.setFieldValue('custrecord_jj_subject_outbound',emailsubject);
        recEmail.setFieldValue('custrecord_jj_body_outbound',emailBody);

        nlapiSubmitRecord(recEmail); 
        
    }catch(e){
        nlapiLogExecution('debug','error passingdata',e);
    }
}
