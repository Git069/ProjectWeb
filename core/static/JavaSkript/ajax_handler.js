document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('dynamic-content-container');
    const links = document.querySelectorAll('.ajax-link');

    links.forEach(link => {
        link.addEventListener('click', (event) => {
            // Verhindere, dass der Browser die Seite neu lädt/wechselt
            event.preventDefault();

            // Hole die URL aus dem data-url Attribut
            const url = event.currentTarget.getAttribute('data-url');
            
            // OPTIONAL: Aktualisiere die URL in der Adressleiste (ohne Neuladen!)
            history.pushState(null, '', url); 

            // Starte den AJAX-Aufruf mit der Fetch API
            fetch(url, {
                // Sende den Header, damit Django weiß, dass es ein AJAX-Request ist
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                // Überprüfe den HTTP-Statuscode
                if (!response.ok) {
                    throw new Error('Fehler beim Laden des Inhalts.');
                }
                // Wir erwarten eine JSON-Antwort von Django
                return response.json(); 
            })
            .then(data => {
                // DOM-Manipulation: Füge den HTML-Inhalt in den Container ein
                container.innerHTML = data.html;
                
                // Optional: Ändere den Titel der Seite
                document.title = data.title;
            })
            .catch(error => {
                console.error('AJAX-Fehler:', error);
                container.innerHTML = '<h2>Inhalt konnte nicht geladen werden.</h2>';
            });
        });
    });
});