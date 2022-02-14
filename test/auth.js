const expect = require('chai').expect;
const sinon = require('sinon');

const User = require('../models/user');
const { postLogin } = require('../controllers/auth');

describe('Auth Controller - Login', () => {
    it ('Fail to Access Database', async () => {
        sinon.stub(User, 'findOne');
        User.findOne.throws();

        const req = {
            body: {
                email: 'sanya',
                password: '220931'
            }
        };

        await postLogin(req, null, (err) => {
            expect(err).to.be.an('error');
            expect(err.statusCode).to.equal(500);
        });

        User.findOne.restore();
    });
});



