import { Router } from "express"
import { userRouter } from "../modules/user/user.routes"
import { transectionRouter } from "../modules/Transection/transection.routes"
import { userSummaryRoute } from "./../modules/UserSummary/userSummary.routes"

export const router = Router()

const moduleRoutes = [
    {
        path: '/user',
        route: userRouter
    },{
        path : '/transeciton',
        route : transectionRouter
    },{
        path : "/summary",
        route : userSummaryRoute
    }
]

moduleRoutes.forEach((r) => {
    router.use(r.path, r.route)
})
