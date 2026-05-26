// javascript
import PropTypes from 'prop-types';
import './Alert.css';

const Alert = ({ type = 'info', message }) => {
    if (!message) return null;

    const ariaProps =
        type === 'error' || type === 'warning'
            ? { role: 'alert', 'aria-live': 'assertive' }
            : { role: 'status', 'aria-live': 'polite' };

    return (
        <div className={`alert alert--${type}`} {...ariaProps}>
            {message}
        </div>
    );
};

Alert.propTypes = {
    type: PropTypes.oneOf(['success', 'error', 'info', 'warning']),
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};

Alert.defaultProps = {
    type: 'info',
    message: null,
};

export default Alert;
