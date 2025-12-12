
import { auth } from './../../middlewares/middleware';
import { Router } from 'express';
import { searchSummary, SeeSummary } from './userSummary.controller';



export const userSummaryRoute = Router()


userSummaryRoute.get('/searchSummary',auth,searchSummary) //search summary
