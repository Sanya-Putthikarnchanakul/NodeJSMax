const expect = require('chai').expect;
const sinon = require('sinon');
const validation = require("express-validator");

const User = require('../models/user');
const { getStatus, postCreatePost } = require('../controllers/feed');

describe('Feed Controller - Get Status', () => {
    it ('Case 1 : Database Access Error', async () => {
        sinon.stub(User, 'findById');
        User.findById.throws();

        const req = { userId: 'abc123' };

        await getStatus(req, null, (err) => {
            expect(err).to.be.an('error');
            expect(err.statusCode).to.equal(500);
        });

        User.findById.restore();
    });

    it ('Case 2 : Can not Find User with specific Id', async () => {
        sinon.stub(User, 'findById');
        User.findById.returns(null);

        const req = { userId: 'abc123' };

        await getStatus(req, null, (err) => {
            expect(err).to.be.an('error');
            expect(err.statusCode).to.equal(404);
            expect(err.message).to.equal('User not Found.');
        });

        User.findById.restore();
    });

    it ('Case 3 : Success', async () => {
        sinon.stub(User, 'findById');
        User.findById.returns({ status: 'I am New' });

        const req = { userId: 'abc123' };
        const res = {
            statusCode: null,
            data: null,
            status: function (statusCode) {
                this.statusCode = statusCode;
                return this;
            },
            json: function (data) {
                this.data = data;
            }
        };

        await getStatus(req, res, null);

        expect(res.statusCode).to.equal(200);
        expect(res.data.status).to.equal('I am New');
        
        User.findById.restore();
    });
});

describe('Feed Controller - Create Post', () => {
    it ('Case 1 : Validation Error', async () => {

    });
});