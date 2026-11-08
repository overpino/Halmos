# Halmos

Halmos è un generatore di note statiche leggero e privo di dipendenze lato server. Il progetto si basa su un'architettura client-side in JavaScript che carica asincronamente i file Markdown e li renderizza direttamente nel browser attraverso `marked.js` e `MathJax 3`. L'estetica e la cura tipografica si ispirano al progetto [jemdoc+MathJax](https://www.mit.edu/~wsshin/jemdoc+mathjax.html), ma l'intero codice è stato sviluppato da zero per il web moderno.

## Sviluppo locale

Per testare il sito in locale è necessario rigenerare l'indice dei contenuti e avviare il server web. Il comando seguente esegue entrambe le operazioni disabilitando preventivamente la cache del browser:

```bash
python scripts/build_manifest.py && python -m http.server
```

Il sito sarà accessibile all'indirizzo `http://localhost:8000` o sulla porta indicata dal terminale.

## Struttura e navigazione

Il menu di navigazione laterale riflette l'albero delle directory contenuto nella cartella `_notes/`. Le cartelle di primo livello definiscono le macro-sezioni, mentre le sottocartelle o i singoli file generano le voci cliccabili del menu. 

Nel caso in cui una directory contenga un unico file senza ulteriori sottocartelle, il collegamento punterà direttamente a quel documento, evitando la creazione di un indice intermedio. I file posizionati nella radice di `_notes/` vengono raggruppati automaticamente sotto una voce di default denominata "Generale". Il sistema ignora qualsiasi file o cartella il cui nome inizi con un punto o con un carattere di sottolineatura.

### Regole di formattazione dei nomi

* **Spazi:** I caratteri del trattino (`-`) e dell'underscore (`_`) presenti nei nomi di file e directory vengono convertiti in spazi bianchi all'interno del menu.
* **Ordinamento forzato:** È possibile anteporre un prefisso numerico (es. `01_introduzione.md`) per determinare la gerarchia dei file. Il prefisso verrà nascosto nell'interfaccia finale.
* **Home Page:** Per fissare una sezione in cima al menu e impostarla come pagina iniziale all'avvio del sito, è sufficiente anteporre un punto esclamativo (`!`) al nome della cartella.

## Stile

Il layout riproduce l'estetica di un articolo accademico. Adotta il font *New Computer Modern*, il testo giustificato con supporto alla sillabazione, i paragrafi rientrati e tabelle conformi allo standard *booktabs*.

La personalizzazione dei parametri geometrici e tipografici del layout (come larghezza della pagina, interlinea e rientri) può essere effettuata modificando le variabili CSS globali posizionate all'inizio del file `paper.css`.

### Elementi Speciali

| Elemento | Sintassi Markdown | Comportamento nel Browser |
| :--- | :--- | :--- |
| **Titolo Pagina** | Primo header `# H1` nel file | Diventa il tag `<title>` della pagina. Se assente, viene usato il nome del file. |
| **Matematica** | Sintassi standard LaTeX | Supporto nativo per formule in linea (`$ ... $`) e blocchi di equazioni numerate (`$$ ... $$`). |
| **Figure** | Immagine isolata in un paragrafo | Convertita in figura numerata e centrata. Il testo alternativo (`alt`) diventa la didascalia. |

## Deployment

La pubblicazione in produzione è interamente automatizzata tramite **GitHub Actions**. Ogni operazione di `push` sul branch principale attiva un workflow che rigenera il file `manifest.json` con l'albero di navigazione aggiornato e distribuisce i file statici su GitHub Pages.
