import { PrismaClient, user, webhook } from '@prisma/client';
import { CreateUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { getAccessToken, isEmpty, mobileValidation, sendOtp } from '@utils/util';
import * as CryptoJS from "crypto-js";
import { generateOTP } from "../utils/util";
var unirest = require('unirest');
var Razorpay = require("razorpay");
var crypto = require("crypto");
const user = new PrismaClient().user;
const otp = new PrismaClient().otp;
const paymentEntries = new PrismaClient().paymentEntries;
const webhook = new PrismaClient().webhook
import { user_type, amount_type, category_type, payment_status } from '@prisma/client';

import transaction from './transaction.service'
let createTransaction = new transaction().createTransaction

let instance = new Razorpay({
  key_id: process.env.razorpay_key_test_id,
  key_secret: process.env.razorpay_key_test_secret,
});

class UserService {

  public async createUser(userData: CreateUserDto): Promise<user> {
    try {
      const mobileNumber = userData.mobile.toString();
      if (mobileNumber.length !== 10) {
        throw new HttpException(400, "Mobile number is not valid...!");
      }

      const mobile = Number(mobileNumber)
      const findUser: user = await user.findFirst({ where: { mobile } });
      if (findUser) throw new HttpException(400, `Your mobile number ${userData.mobile} already exist...!`);

      let keysec = process.env.ENCRYPTION_KEY as string;
      var ciphertext = CryptoJS.AES.encrypt(userData.password, keysec).toString();
      const createUserData: user = await user.create({ data: { ...userData, password: ciphertext, } });
      return createUserData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findAllUser(req: any): Promise<user[]> {
    try {
      let skip = (parseInt(req.query.pageNumber) - 1) * parseInt(req.query.pageSize);
      let take = parseInt(req.query.pageSize);

      const obj = {
        skip, take, where: { isDeleted: false },
        include: {
          developer: true,
          owner: true,
          lawyer: true,
          architect: true,
          mozni: true
        }
      }

      const count = await user.count({
        where:
          { isDeleted: false }
      });

      if (!req.query.pageSize && !req.query.pageNumber) {
        delete obj.skip;
        delete obj.take;
      }

      const allUser: user[] = await user.findMany(obj);
      let data: any = {};
      data.count = count;
      data.allUser = allUser;
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async findUserById(userId: string): Promise<user> {
    try {
      const findUser: user = await user.findUnique({
        where: { userId: userId },
        include: {
          developer: true,
          owner: true,
          lawyer: true,
          architect: true,
          mozni: true
        }
      });
      if (!findUser) throw new HttpException(400, "This User doesn't exist...!");

      return findUser;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async updateUser(userId: string, userData: CreateUserDto): Promise<user> {
    try {
      if (isEmpty(userData)) throw new HttpException(400, "User data cannot be empty...!");

      const findUser: user = await user.findUnique({
        where: { userId: userId },
        include: {
          developer: true,
          owner: true,
          lawyer: true,
          architect: true,
          mozni: true
        }
      });
      if (!findUser) throw new HttpException(400, "User doesn't exist...!");

      await mobileValidation(userData, findUser);

      const updateUserData = await user.update({ where: { userId: userId }, data: { ...userData } });
      return updateUserData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async deleteUser(userId: string): Promise<user> {
    try {
      if (isEmpty(userId)) throw new HttpException(400, "User data cannot be empty...!");

      const deleteUserData: user = await user.update({
        where: { userId: userId },
        data: { isDeleted: true }
      });
      if (!deleteUserData) throw new HttpException(400, "You're not user...!");

      return deleteUserData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async loginUser(data: any): Promise<any> {
    try {
    let mobile;
    let email;
    let password;

    if (data.mobile) {
      mobile = data.mobile;

      if (isEmpty(mobile)) throw new HttpException(400, "Mobile data cannot be empty...!");

      if (typeof mobile === "string") {
        throw new HttpException(400, "Mobile number is expecting type number...!");
      }

      const mobileNumber = mobile.toString();

      if (mobileNumber.length !== 10) {
        throw new HttpException(400, "Mobile number is not valid...!");
      }

      const loginUserData = await user.findFirst({ where: { mobile } });
      if (!loginUserData) throw new HttpException(400, "You're not user...!");
      else {
        const otpString: string = generateOTP();
        const SMS_GATEWAY_KEY = "zOJwD2nQ2EGnwUMPTxNC3g";
        await sendOtp(mobile, otpString);
        let sendResponse = unirest('POST', `https://www.smsgatewayhub.com/api/mt/SendSMS?APIKey=${SMS_GATEWAY_KEY}&senderid=DRMSRD&channel=OTP&DCS=0&flashsms=0&number=91${mobile}&text=Hello, 
      ${otpString} is OTP for registering on Dreamsredeveloped. Please do not share this OTP. Thanks!&route=1`)
          .headers({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': 'PHPSESSID=61vmra84rl52hhk099p4fpl156'
          })

          .end(function (sendResponse: any) {
            if (sendResponse.error) throw new Error(sendResponse.error);
            return sendResponse.raw_body;
          });
        return { message: "OTP sent successfully." };
      }
    }
    else if (data.email) {
      email = data.email;

      if (isEmpty(email)) throw new HttpException(400, "Email data cannot be empty...!");

      if (!data.password) {
        throw new HttpException(400, "Enter correct password...!");
      }

      password = data.password;

      const findUser = await user.findFirst({
        where: { emailId: email },
        include: {
          developer: true,
          owner: true,
          lawyer: true,
          architect: true,
          mozni: true,
        }
      });

      if (!findUser) throw new HttpException(400, "Invalid Email...!");

      let dbPassword = findUser.password;

      let keysec = process.env.ENCRYPTION_KEY as string;
      var bytes = CryptoJS.AES.decrypt(dbPassword, keysec);

      var originalText = bytes.toString(CryptoJS.enc.Utf8);

      if (originalText == password) {

        const accessToken = await getAccessToken({ email }, "userLoginWithEmail");
        if (accessToken) console.log("User logged in successfully");

        const data = {
          userId: findUser?.userId,
          emailId: findUser?.emailId,
          mobile: findUser?.mobile,
          developer: findUser?.developer,
          owner: findUser?.owner,
          lawyer: findUser?.lawyer,
          architect: findUser?.architect,
          mozni: findUser?.mozni,
        }
        return { accessToken, data };
      }
      }
      } catch (error) {
        console.log(error);
        throw error;
    }
  }

  public async verifyotpinloginData(mobile: number, receivedotp: string): Promise<any> {
    try {
      if (isEmpty(receivedotp)) throw new HttpException(400, "OTP cannot be mepyu...!");

      const maxOtpValidityMinutes = 10; // 10 minutes
      const verifyotpinloginData = await otp.findFirst({ where: { mobile, otp: receivedotp }, });
      if (!verifyotpinloginData) throw new HttpException(400, "Otp is not valid...!");
      else {
        const otpTimestamp = verifyotpinloginData.createdAt;
        const currentTime = new Date();
        const timeDifference = (currentTime.getTime() - otpTimestamp.getTime()) / 1000 / 60; // difference in minutes


        if (timeDifference > maxOtpValidityMinutes) {
          throw new HttpException(400, "Otp has expired! Please request a new one...!");

        } else {
          await otp.update({
            where: { id: verifyotpinloginData.id },
            data: { verified: true },
          });
          const accessToken = await getAccessToken({ mobile }, "userLogin");
          if (accessToken) console.log("User logged in successfully");

          const userData = await user.findFirst({
            where: { mobile },
            include: {
              developer: {
                include: {
                  initialProject: true,
                  redevelopProject: true
                }
              },
              owner: {
                include: {
                  project: true,
                  property: true
                }
              },
              lawyer: {
                include: {
                  project: true
                }
              },
              architect: {
                include: {
                  project: true
                }
              },
              mozni: {
                include: {
                  project: true
                }
              },
            }
          });

          const data = {
            userId: userData?.userId,
            emailId: userData?.emailId,
            mobile: userData?.mobile,
            developer: userData?.developer,
            owner: userData?.owner,
            lawyer: userData?.lawyer,
            architect: userData?.architect,
            mozni: userData?.mozni
          }
          return { accessToken, data };
        }
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async adminLogin(emailId: string, password: string): Promise<any> {
    try {
      if (isEmpty(emailId)) throw new HttpException(400, "Email data cannot be empty...!");

      const findUser = await user.findFirst({ where: { emailId } });

      if (!findUser) throw new HttpException(400, "Invalid Email...!");

      else {
        if (emailId == "admin@gmail.com") {
          if(password != "123456")
          {
            throw new HttpException(400, "Invalid Credentials...!")
          }

          let keysec = process.env.ENCRYPTION_KEY as string;
          var bytes = CryptoJS.AES.decrypt(findUser.password, keysec);

          var originalText = bytes.toString(CryptoJS.enc.Utf8);

          if (originalText == password) {

            let accessToken = await getAccessToken({ emailId }, "adminLogin");
            let responseData = {
              userId: findUser.userId,
              emailId: findUser.emailId,
              mobile: findUser.mobile,
              token: accessToken
            }

            console.log('Admin  logged in successfully');
            return responseData;
          }
        }
        else {
          throw new HttpException(400, "Admin Invalid...!");
        }
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async webhook(req): Promise<any> {
    try {
      const createWebhhok: webhook = await webhook.create({
        data: {
          ...req.body,
        },
      });

      return webhook;
    } catch (error) {
      console.log(error);
      throw error;
    }

  }

  public async createOrder(req): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        var input: any = req.body;
        var receiptId = "order_receiptId_" + Date.now().toString();

        var options = {
          amount: Number(input.amount) * 100,
          currency: "INR",
          receipt: receiptId,
          payment_capture: "1",
        };
        var data = {
          projectId: input.projectId,
          amount: input.amount,
          developerId: input.developerId,
          paymentConditionOne: "Initiated",
          paymentConditionTwo: "Initiated",
        };

        await instance.orders.create(options, async function (err, order) {
          if (err) {
            console.log(err);
            reject(
              Promise.reject(
                new HttpException(403, "Error in Razor pay create order call")
              )
            );
          } else {
            let paymentEntryValues = await paymentEntries.create({
              data: { ...data },
            });
            resolve({ order: order, paymentEntry: paymentEntryValues });
          }
        });
      } catch (err) {
        console.log(err);
        reject(
          Promise.reject(
            new HttpException(403, "Error in Razor pay create order call")
          )
        );
      }
    });
  }

  public async capturePaymentStatus(req): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let input = req.body;

        if (input.code == 200) {
          var hmac = crypto.createHmac(
            "sha256",
            process.env.razorpay_key_live_secret
          );
          var data1 = hmac.update(
            input.paymentDetails.razorpay_order_id +
            "|" +
            input.paymentDetails.razorpay_payment_id
          );
          var generated_signature = data1.digest("hex");
          if (generated_signature == input.paymentDetails.razorpay_signature) {
            let updateUserPayment = await paymentEntries.update({
              where: {
                id: input.orderId,
              },
              data: {
                paymentConditionOne: "Success",
              },
            });

            let transactionObject = {
              amountType: amount_type.CREDIT,
              transactionNumber: input.paymentDetails.razorpay_payment_id.toString() as string,
              additionalInfo: "Transaction under bidding",
              persona: user_type.developer,
              personaId: input.developerId as string,
              category: category_type.BIDDING,
              paymentStatus: payment_status.SUCCESS,
              isPaymentOnline: true,
              projectId: input.projectId,
              amount: input.amount
            }

            let addTransaction = await createTransaction(transactionObject)

            resolve({ code: 200 });
          } else {
            console.log("1");
            //Failed
            let updateUserPayment = await paymentEntries.update({
              where: {
                id: input.orderId,
              },
              data: {
                paymentConditionOne: "fail",
              },
            });

            resolve({ code: 400 });
          }
        } else if (input.code == 400) {
          console.log("2");
          resolve({ code: 400 });
        }
      } catch (err) {
        console.log(err);
        reject(
          Promise.reject(
            new HttpException(403, "Error in Razor pay create order call")
          )
        );
      }
    });
  }

}

export default UserService;
