import { Router } from "express"
import { userRouter } from "../modules/user/user.routes"
import { transectionRouter } from "../modules/Transection/transection.routes"

export const router = Router()

const moduleRoutes = [
    {
        path: '/user',
        route: userRouter
    },{
        path : '/transeciton',
        route : transectionRouter
    }
]

moduleRoutes.forEach((r) => {
    router.use(r.path, r.route)
})
