// ReaderDashboard now uses the same HomePage component
// Prop hideNavbar and hideFooter is passed because ReaderLayout already provides them
import HomePage from './HomePage';

const ReaderDashboard = () => {
    return <HomePage hideNavbar={true} hideFooter={true} />;
};

export default ReaderDashboard;
