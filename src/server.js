const express = require('express');
const os = require('os')
const app = express();
const conversor = require('./convert')
const bodyParser = require('body-parser');
const config = require('./config/system-life');
const path = require('path');
const promBundle = require('express-prom-bundle');
const morgan = require('morgan');

const metricsMiddleware = promBundle({
  includePath: true,
  includeStatusCode: true,
  includeMethod: true,
  customLabels: {service: 'conversao-temperatura'},
  promClient: {
    collectDefaultMetrics: {
    }
  }
});

app.use(metricsMiddleware);
app.use(morgan('combined'));

app.use(config.middlewares.healthMid);
app.use('/', config.routers);
app.use(bodyParser.urlencoded({ extended: false }))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/fahrenheit/:valor/celsius', (req, res) => {

    let valor = req.params.valor;
    let celsius = conversor.fahrenheitCelsius(valor);
    console.log(`[conversao] fahrenheit -> celsius | entrada: ${valor}°F | saida: ${celsius}°C`);
    res.json({ "celsius": celsius, "maquina": os.hostname() });
});

app.get('/celsius/:valor/fahrenheit', (req, res) => {

    let valor = req.params.valor;
    let fahrenheit = conversor.celsiusFahrenheit(valor);
    console.log(`[conversao] celsius -> fahrenheit | entrada: ${valor}°C | saida: ${fahrenheit}°F`);
    res.json({ "fahrenheit": fahrenheit, "maquina": os.hostname() });
});

app.get('/', (req, res) => {
    console.log('[GET /] pagina inicial acessada');
    res.render('index',{valorConvertido: '', maquina: os.hostname()});
});

app.post('/', (req, res) => {
    let resultado = '';

    if (req.body.valorRef) {
        if (req.body.selectTemp == 1) {
            resultado = conversor.celsiusFahrenheit(req.body.valorRef)
            console.log(`[POST /] celsius -> fahrenheit | entrada: ${req.body.valorRef}°C | saida: ${resultado}°F`);
        } else {
            resultado = conversor.fahrenheitCelsius(req.body.valorRef)
            console.log(`[POST /] fahrenheit -> celsius | entrada: ${req.body.valorRef}°F | saida: ${resultado}°C`);
        }
    } else {
        console.log('[POST /] requisicao sem valor informado');
    }

    res.render('index', {valorConvertido: resultado, "maquina": os.hostname()});
 });

app.listen(8080, () => {
    console.log(`[startup] Servidor rodando na porta 8080 | hostname: ${os.hostname()} | pid: ${process.pid}`);
});
