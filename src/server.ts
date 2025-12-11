
// MONGODB CONNECT

import mongoose from "mongoose";
import { app } from "./app";
import { createAdmin } from "./apps/utils/createAdmin";



let server;

const startServer = async () => {
    await mongoose
        .connect(process.env.DB_URL as string);
    console.log("server running");

    server = app.listen(process.env.PORT, () => {
        console.log(`server is runnig on ${process.env.PORT}`)
    })
}


(async () => {
    await startServer();
    await createAdmin()
})();


