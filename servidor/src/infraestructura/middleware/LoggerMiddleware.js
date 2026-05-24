export const loggerMiddleware = (req, res, next)=>{
   console.log ("Se autentico "+ req.traceId +" metodo:"+ req.method + " url :" +req.url);
   //console.log (`Se autentico ${req.traceId} metodo: ${req.method} url: ${req.url}`)
   next();
}