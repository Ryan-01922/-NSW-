const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');

const { verifyToken, verifySignature } = require('../src/middleware/auth');

chai.use(chaiHttp);

describe('Authentication Middleware Tests', () => {
  describe('verifyToken', () => {
    it('should return 403 when no token is provided', (done) => {
      const req = {
        headers: {}
      };
      const res = {
        status: (code) => {
          expect(code).to.equal(403);
          return {
            json: (data) => {
              expect(data.message).to.equal('Access token is required');
              done();
            }
          };
        }
      };
      verifyToken(req, res, () => {});
    });

    it('should validate a valid token', (done) => {
      const token = jwt.sign({ address: '0x123' }, process.env.JWT_SECRET);
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      verifyToken(req, res, () => {
        expect(req.user).to.have.property('address');
        expect(req.user.address).to.equal('0x123');
        done();
      });
    });
  });

  describe('verifySignature', () => {
    it('should verify a valid Ethereum signature', async () => {
      const wallet = ethers.Wallet.createRandom();
      const message = 'Verification message';
      const signature = await wallet.signMessage(message);
      
      const req = {
        body: {
          signature,
          message,
          address: wallet.address
        }
      };
      
      const res = {
        status: (code) => ({
          json: (data) => {
            expect(code).to.equal(401);
            expect(data.message).to.equal('Signature verification failed');
          }
        })
      };

      await verifySignature(req, res, () => {
        expect(req.verifiedAddress).to.equal(wallet.address);
      });
    });

    it('should reject invalid signature', async () => {
      const req = {
        body: {
          signature: '0x123',
          message: 'Verification message',
          address: '0x456'
        }
      };

      const res = {
        status: (code) => ({
          json: (data) => {
            expect(code).to.equal(401);
            expect(data.message).to.equal('Signature verification failed');
          }
        })
      };

      await verifySignature(req, res, () => {});
    });
  });
}); 