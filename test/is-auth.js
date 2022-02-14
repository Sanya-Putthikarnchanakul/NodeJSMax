const expect = require('chai').expect;
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const isAuth = require('../utils/is-auth');

//#region Mock Test

/*const myFunction = (req) => {
    if (!req) {
        const err = new Error('No Data.');
        err.code = 401;
        throw err;
    }
}

it ('should throw an error', () => {
    expect(() => myFunction(null)).to.throw('No Data.');
});*/

//#endregion

describe('Auth Middleware', () => {
    it('should retrun statusCode = 401 if no authorization header is present', () => {
        const req = {
            get: () => {
                return null;
            }
        };
    
        isAuth(req, null, (err) => {
            expect(err.statusCode).to.equal(401);
        });
    });
    
    it('should retrun error message = No Auth Header. if no authorization header is present', () => {
        const req = {
            get: () => {
                return null;
            }
        };
    
        isAuth(req, null, (err) => {
            expect(err.message).to.equal('No Auth Header.');
        });
    });
    
    it ('should retrun status code = 500 if authorization header is invalid', () => {
        const req = {
            get: () => {
                return 'Bearer';
            }
        };
    
        isAuth(req, null, (err) => {
            expect(err.statusCode).to.equal(500);
        });
    });

    it ('should retrun status code = 500 if fail to verify bearer token', () => {
        const req = {
            get: () => {
                return 'Bearer xyz';
            }
        };

        isAuth(req, null, (err) => {
            expect(err.statusCode).to.equal(500);
        });
    });

    it ('should retrun statusCode = 401 if invalid token', () => {
        const req = {
            get: () => {
                return 'Bearer l,sdc46sdDlkmsd51218sdenm';
            }
        };

        sinon.stub(jwt, 'verify')
        jwt.verify.returns(null);

        isAuth(req, null, (err) => {
            expect(err.statusCode).to.equal(401);
        });

        jwt.verify.restore();
    });

    it ('should retrun error message = Not Found Token. if invalid token', () => {
        const req = {
            get: () => {
                return 'Bearer l,sdc46sdDlkmsd51218sdenm';
            }
        };

        sinon.stub(jwt, 'verify')
        jwt.verify.returns(null);

        isAuth(req, null, (err) => {
            expect(err.message).to.equal('Not Found Token.');
        });

        jwt.verify.restore();
    });

    it ('should retrun userId if valid token', () => {
        const req = {
            get: () => {
                return 'Bearer l,sdc46sdDlkmsd51218sdenm';
            }
        };

        sinon.stub(jwt, 'verify');
        jwt.verify.returns({ userId: 'abc' });

        isAuth(req, null, () => {});

        expect(req).to.have.property('userId');

        //expect(req).to.have.property('userId', 'abc');

        //expect(jwt.verify.called).to.be.true;

        jwt.verify.restore();
    });
});



