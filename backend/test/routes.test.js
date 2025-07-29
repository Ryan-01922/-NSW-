const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const app = require('../src/app');
const jwt = require('jsonwebtoken');

chai.use(chaiHttp);

describe('API Routes Tests', () => {
  let testToken;
  
  before(() => {
    testToken = jwt.sign({ address: '0x123' }, process.env.JWT_SECRET);
  });

  describe('Property Management API', () => {
    it('should get property list', (done) => {
      chai.request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${testToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });

    it('should get single property details', (done) => {
      const propertyId = 1;
      chai.request(app)
        .get(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('id');
          done();
        });
    });
  });

  describe('Renewal Request API', () => {
    it('should create renewal request', (done) => {
      chai.request(app)
        .post('/api/renewals')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          propertyId: 1,
          duration: 5,
          reason: 'Test renewal'
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('id');
          done();
        });
    });
  });

  describe('Property Transfer API', () => {
    it('should create transfer request', (done) => {
      chai.request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          propertyId: 1,
          newOwner: '0x456',
          price: '1000000000000000000'
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('id');
          done();
        });
    });
  });

  describe('Agent Authorization API', () => {
    it('should create agent authorization', (done) => {
      chai.request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          agentAddress: '0x789',
          propertyId: 1,
          permissions: ['TRANSFER', 'RENEWAL']
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('id');
          done();
        });
    });
  });
}); 