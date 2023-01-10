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
       try{
        if(toAddress.length>0){
          for(var j=0;j<toAddress.length;j++){
            if(toAddress[j]=="emails.5272043_SB1.664.ef4e8300a8@5272043-sb1.email.netsuite.com"){
               var recEmail1 = nlapiCreateRecord("customrecord_jj_corp_material");
        recEmail1.setFieldValue('custrecord_jj_corp_material_from',fromAddress);
        recEmail1.setFieldValue('custrecord_jj_corp_material_to',"emails.5272043_SB1.664.ef4e8300a8@5272043-sb1.email.netsuite.com");
        recEmail1.setFieldValue('custrecord_jj_corp_material_subject',emailsubject);
        recEmail1.setFieldValue('custrecord_jj_corp_material_body',emailBody);

        nlapiSubmitRecord(recEmail1);
            }
            else if(toAddress[j]=="emails.5272043_SB1.663.15ee687f30@5272043-sb1.email.netsuite.com"){
                      
         var recEmail2 = nlapiCreateRecord("customrecord_jj_cdus_2016_outbound");
        recEmail2.setFieldValue('custrecord_jj_from_outbound',fromAddress);
        recEmail2.setFieldValue('custrecord_jj_from_outbound_',"emails.5272043_SB1.663.15ee687f30@5272043-sb1.email.netsuite.com");
        recEmail2.setFieldValue('custrecord_jj_subject_outbound',emailsubject);
        recEmail2.setFieldValue('custrecord_jj_body_outbound',emailBody);

        nlapiSubmitRecord(recEmail2); 
            }
            else if(toAddress[j]=="emails.5272043_SB1.662.827c3b18db@5272043-sb1.email.netsuite.com"){
                        var recEmail = nlapiCreateRecord("customrecordcustomrecord_email");
        recEmail.setFieldValue('custrecordemail_from',fromAddress);
        recEmail.setFieldValue('custrecordemail_to',"emails.5272043_SB1.662.827c3b18db@5272043-sb1.email.netsuite.com");
        recEmail.setFieldValue('custrecordemail_subject',emailsubject);
        recEmail.setFieldValue('custrecordemail_body',emailBody);

        nlapiSubmitRecord(recEmail);
            }else{
              continue;
            }
            
          }


      }
    }catch(e){
        nlapiLogExecution('debug','error passingdata',e);
    }
}
