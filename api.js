const express = require('express');
const app = express();
const port = 3500;

app.use(express.json());

app.listen(port, () => {
    console.log(`Server sudah nyala dan berjalan di port ${port}`)
})