import { Router } from 'express';
import TransactionController from '@controllers/transaction.controller';
import { CreateTransactionDto } from '@dtos/transaction.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

class TransactionRoute implements Routes {
  public path = '/transaction';
  public router = Router();
  public transactionController = new TransactionController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {    
    this.router.get(`${this.path}`, this.transactionController.getTransaction);
    this.router.get(`${this.path}/getReturnBidDevelopers`, this.transactionController.getReturnBidDevelopers);
    this.router.get(`${this.path}/getBidTotal`, this.transactionController.getBidTotal);

    this.router.post(`${this.path}/returnBid`, authMiddleware, this.transactionController.returnBidTransaction);
    this.router.post(`${this.path}`, authMiddleware, validationMiddleware(CreateTransactionDto, 'body'), this.transactionController.createTransaction);
    
    this.router.put(`${this.path}/approveTransaction`, authMiddleware, this.transactionController.approveTransaction);
    //this.router.get(`${this.path}/:id`, this.transactionController.getTransactionById);
    //this.router.put(`${this.path}/:id`, authMiddleware, this.transactionController.updateTransaction);
    //this.router.delete(`${this.path}/:id`, authMiddleware, this.transactionController.deleteTransaction);
  }
}

export default TransactionRoute;