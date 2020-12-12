import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as AWS from 'aws-sdk';
admin.initializeApp();
const REFUND_DB = functions.config().database.refunddb;

//Aws SNS config
AWS.config.update({
    accessKeyId: functions.config().awssns.accesskey,
    secretAccessKey: functions.config().awssns.secretkey,
    region: 'ap-south-1'
});
const sns = new AWS.SNS();

export const sendRefundStatusSMSAWS = 
functions.database.instance(REFUND_DB).ref('/Refunds/{refundId}')
    .onWrite(async (change, context) =>{
        const snapshot = change.after;
        const refund = snapshot.val();
        const refundAmount = refund.refundAmount;
        const currentStatus  = refund.status;
        
        const order = refund.orderModel;
        const userPhoneNumber = order.userPhone;
        const restaurantName = order.restaurantName;
        const orderPlacedDateTime = order.transactionTime;

        console.log('Phone Number',userPhoneNumber);
        console.log('Restaurant Name',restaurantName);
        console.log('status',currentStatus);
        console.log('Order Id',context.params.refundId);
        console.log('Refund Amount',refundAmount);
        console.log('Date Time',orderPlacedDateTime);

        const refundStatusMessage = {
            PhoneNumber: userPhoneNumber,
            Message: 'oncampus order ' +context.params.refundId+  '  '+currentStatus+  '  refund Amount ₹' +refundAmount ,
            MessageAttributes : {
                'AWS.SNS.SMS.SenderID' : {
                    DataType: 'String',
                    StringValue: 'onCampus'
                },
                'AWS.SNS.SMS.SMSType' : {
                    DataType: 'String',
                    StringValue: 'Transactional'
                }
 
            }
        };
        sns.publish(refundStatusMessage, function (err, data) {
            if (err) {
                console.log('ERROR', err.message);
                return;
            }
            else{
                console.log('SMS SENT', data);
                return;
            }
                

        });


    });



