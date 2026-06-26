const fs = require('fs'); 
let c = fs.readFileSync('./src/models/dashboard.model.js', 'utf8'); 
c = c.replace(/= CURRENT_DATE/g, "= DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')"); 
c = c.replace(/CURRENT_DATE >=/g, "DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >="); 
c = c.replace(/CURRENT_DATE <=/g, "DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <="); 
fs.writeFileSync('./src/models/dashboard.model.js', c);
