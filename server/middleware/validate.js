import { ValidationError } from '../utils/errors.js';

export function validate(schemas) {
    return (req, res, next) => {
        try {
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            next();
        } catch (err) {
            if (err.name === 'ZodError') {
                const details = err.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                return next(new ValidationError('Validation failed', details));
            }
            next(err);
        }
    };
}

export default validate;
