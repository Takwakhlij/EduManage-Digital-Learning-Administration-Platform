import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux' // Le Provider relie Redux (le magasin d'état global) à React
import { store } from './app/store'   // Importation du magasin (store) qui contient nos données (ex: auth)
import './index.css'
import App from './App.jsx' // Composant principal de l'application

// Point d'entrée de notre application React. On prend l'élément HTML ayant l'id "root" (dans index.html)
createRoot(document.getElementById('root')).render(
  // StrictMode: Utilisé en développement pour détecter les problèmes potentiels dans l'application
  <StrictMode>
    {/* Envelopper l'application avec Provider pour que tous les composants aient accès au 'store' Redux */}
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
