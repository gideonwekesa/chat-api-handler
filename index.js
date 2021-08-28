const AWS = require('aws-sdk')

const ENDPOINT = '51jlw8ijf1.execute-api.eu-west-2.amazonaws.com/production/@connections/'
const client = new AWS.ApiGatewayManagementApi({endpoint: ENDPOINT});
const names = {}
const sendToOne = async (id, body) => {
    try {
        await client.postToConnection({
            'connectionId': id,
            'data': Buffer.from(JSON.stringify(body)),
        }).promise();
    } catch (err) {
        console.log(err)
    }
}

const sendToAll = async (ids, body) => {
    const all = ids.map(i => sendToOne(i, body))
    return Promise.all(all)
    
}




exports.handler = async (event) => {
   
   //extract the connection ID unique to clients connecting to the web socket 
    if (event.requestContext) {
        const connectionId = event.requestContext.connectionId;
        
        const routeKey = event.requestContext.routeKey;
        
        let body = {};
        try {
            if (event.body) {
                body = JSON.parse(event.body)
            }
        } catch (e) {
            
        }
        
        
        switch (routeKey) {
            case '$connect':
                // code
                break;
                case '$disconnect':
                await sendToAll(Object.keys(names), {systemMessage: `${names[connectionId]} has left the chat` })
                delete names[connectionId]
                await sendToAll(Object.keys(names), {members: Object.values(names) })
                break;
                case 'default':
                // code
                break;
                case 'setName':
                names[connectionId] = body.name
                await sendToAll(Object.keys(names), {members: Object.values(names) })
                await sendToAll(Object.keys(names), {systemMessage: `${names[connectionId]} has joined the chat` })
                break;
                case 'sendPublic':
                await sendToAll(Object.keys(names), {publicMessage: `${names[connectionId]}: ${body.message}` })
                break;
                case 'sendPrivate':
                const to = Object.keys(names).find(key => names[key] === body.to)
                await sendToOne(to, {privateMessage: `${names[connectionId]}: ${body.message}`})
                break;
            
            default:
                // code
        }
    }
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
