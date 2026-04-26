// Service Worker - Association Coranique
// Ce fichier tourne EN ARRIÈRE-PLAN dans le navigateur

// Événement déclenché quand une notification Push arrive du serveur
self.addEventListener('push', function(event) {
    // On récupère les données envoyées par le serveur (JSON ou texte brut)
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Association Coranique', body: event.data.text() };
        }
    }

    const title = data.title || 'Association Coranique';
    const options = {
        body: data.body || 'Vous avez une nouvelle notification.',
        icon: '/logo192.png',
        badge: '/logo192.png',
        data: {
            url: data.url || '/',
        },
        vibrate: [200, 100, 200],
        requireInteraction: true,
    };

    // On affiche la notification
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Événement déclenché quand l'utilisateur clique sur la notification
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // On ferme la notification

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                // Si l'application est déjà ouverte, on la met au premier plan
                for (const client of clientList) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Sinon, on ouvre un nouvel onglet
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// Activation du Service Worker
self.addEventListener('activate', function(event) {
    console.log('Service Worker activé - Association Coranique');
});
