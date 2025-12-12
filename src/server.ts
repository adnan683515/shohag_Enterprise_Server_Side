
// MONGODB CONNECT

import mongoose from "mongoose";
import { app } from "./app";
import { createAdmin } from "./apps/utils/createAdmin";
import { scheduleSheetTitles } from "./apps/modules/Transection/transection.controller";



let server;

const startServer = async () => {
    await mongoose
        .connect(process.env.DB_URL as string);
    server = app.listen(process.env.PORT, () => {
        console.log(`server is runnig on ${process.env.PORT}`)
    })
}


(async () => {
    await startServer();
    await scheduleSheetTitles()
    await createAdmin()

    
})();


