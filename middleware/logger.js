import fs from 'fs';

function logger(req,res,next){
    fs.appendFile('server.log',
        `\n ${req.url} - ${req.method} - ${new Date() }`,
        'utf-8',
        (err)=>{
            if(err){
                console.log('Unable to log message');
                console.log(err);
            }
            else{
                console.log(`${req.url} - ${req.method} - ${new Date() }`,
        'utf-8')
            }
        }
    )
    next();
}

export default logger;