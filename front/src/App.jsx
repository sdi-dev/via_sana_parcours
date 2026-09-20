import { Navigate, Route, Routes } from 'react-router';
import Layout from '@components/Layout';
import RouteProtegee from '@components/RouteProtegee';
import Accueil from '@pages/Accueil';
import Connexion from '@pages/Connexion';
import FichePatient from '@pages/praticien/FichePatient';
import ListePatients from '@pages/praticien/ListePatients';
import MonParcours from '@pages/patient/MonParcours';

export default function App() {
    return (
        <Routes>
            <Route path="/connexion" element={<Connexion />} />
            <Route element={<Layout />}>
                <Route path="/" element={<Accueil />} />
                <Route element={<RouteProtegee role="praticien" />}>
                    <Route path="/praticien" element={<ListePatients />} />
                    <Route path="/praticien/patients/:id" element={<FichePatient />} />
                </Route>
                <Route element={<RouteProtegee role="patient" />}>
                    <Route path="/patient" element={<MonParcours />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}