const SafePage = () => {
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", lineHeight: 1.6, color: '#333', backgroundColor: '#ffffff', margin: 0, padding: 0, minHeight: '100vh' }}>
      <header style={{ background: 'linear-gradient(135deg, #009B3A 0%, #007A2E 100%)', color: '#fff', padding: '40px 20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '2.5em', marginBottom: '10px', fontWeight: 700 }}>Curiosidades sobre Sensores de Glicose Contínuos</h1>
        <p style={{ fontSize: '1.1em', opacity: 0.9 }}>Descubra fatos fascinantes sobre a tecnologia que revolucionou o controle do diabetes</p>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        {[
          {
            title: 'A Origem do Monitoramento Contínuo',
            text: (
              <>
                O primeiro conceito de <span style={{ backgroundColor: '#e8f5e9', padding: '2px 6px', borderRadius: '3px', fontWeight: 500 }}>monitoramento contínuo de glicose (MCG)</span> surgiu na década de 1970, mas a tecnologia só se tornou viável para uso doméstico em 1999, quando o primeiro sistema CGM aprovado pela FDA chegou ao mercado. Hoje, o Dexcom G7 representa a sétima geração dessa evolução, com sensores menores que um cartão de crédito.
              </>
            ),
            source: 'Dexcom - História do CGM',
            url: 'https://www.dexcom.com/pt-br',
          },
          {
            title: 'Leituras a Cada 5 Minutos',
            text: (
              <>
                Um sensor CGM moderno como o <span style={{ backgroundColor: '#e8f5e9', padding: '2px 6px', borderRadius: '3px', fontWeight: 500 }}>Dexcom G7</span> realiza <span style={{ backgroundColor: '#e8f5e9', padding: '2px 6px', borderRadius: '3px', fontWeight: 500 }}>288 leituras por dia</span>, ou seja, uma a cada 5 minutos, 24 horas por dia. Isso equivale a mais de 2.000 leituras em uma semana — algo impossível com o método tradicional de picada no dedo, que geralmente é feito 3-4 vezes ao dia.
              </>
            ),
            source: 'Diabetes Brasil - Tecnologia CGM',
            url: 'https://diabetes.org.br/',
          },
          {
            title: 'Sensor no Braço, Dados no Celular',
            text: (
              <>
                Os sensores CGM atuais são tão discretos que podem ser usados no <span style={{ backgroundColor: '#e8f5e9', padding: '2px 6px', borderRadius: '3px', fontWeight: 500 }}>braço ou abdômen</span> sem incomodar nas atividades diárias. A tecnologia envia os dados diretamente para o smartphone via Bluetooth, permitindo que o usuário acompanhe sua glicose em tempo real enquanto trabalha, dorme ou pratica exercícios — algo que parecia ficção científica há 20 anos.
              </>
            ),
            source: 'Sociedade Brasileira de Diabetes',
            url: 'https://sbd.org.br/',
          },
          {
            title: 'Alerta Preditivo de Hipoglicemia',
            text: (
              <>
                Uma das funções mais impressionantes dos CGMs modernos é o <span style={{ backgroundColor: '#e8f5e9', padding: '2px 6px', borderRadius: '3px', fontWeight: 500 }}>alerta preditivo</span>. O sistema pode avisar até <span style={{ backgroundColor: '#e8f5e9', padding: '2px 6px', borderRadius: '3px', fontWeight: 500 }}>20 minutos antes</span> de uma hipoglicemia ocorrer, dando tempo para o paciente comer algo e evitar uma queda perigosa de glicose. Essa previsibilidade salvou inúmeras vidas desde sua introdução.
              </>
            ),
            source: 'ADA - American Diabetes Association',
            url: 'https://diabetes.org/',
          },
          {
            title: 'Compatível com Smartwatch e Bomba de Insulina',
            text: (
              <>
                A integração do CGM com outras tecnologias é impressionante. Hoje é possível ver a glicose no <span style={{ backgroundColor: '#e8f5e9', padding: '2px 6px', borderRadius: '3px', fontWeight: 500 }}>Apple Watch</span>, em <span style={{ backgroundColor: '#e8f5e9', padding: '2px 6px', borderRadius: '3px', fontWeight: 500 }}>smartwatches Android</span> e até em alguns sistemas de <span style={{ backgroundColor: '#e8f5e9', padding: '2px 6px', borderRadius: '3px', fontWeight: 500 }}>bomba de insulina</span>, criando laços fechados que ajustam automaticamente a dose de insulina com base nas leituras em tempo real.
              </>
            ),
            source: 'Dexcom - Compatibilidade de Dispositivos',
            url: 'https://www.dexcom.com/pt-br/compatibility',
          },
          {
            title: 'Resistente à Água e ao Suor',
            text: (
              <>
                Os sensores CGM modernos, incluindo o Dexcom G7, são <span style={{ backgroundColor: '#e8f5e9', padding: '2px 6px', borderRadius: '3px', fontWeight: 500 }}>resistentes à água</span> e podem ser usados durante banhos, piscina e atividades físicas intensas. Isso significa monitoramento ininterrupto mesmo durante treinos de alta intensidade ou natação, eliminando as lacunas de dados que existiam nos primeiros modelos.
              </>
            ),
            source: 'Diabetes Care - Tecnologia Wearable',
            url: 'https://diabetesjournals.org/care',
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: '40px', padding: '25px', backgroundColor: '#f9f9f9', borderLeft: '4px solid #009B3A', borderRadius: '4px' }}>
            <h2 style={{ color: '#1a1a1a', marginBottom: '15px', fontSize: '1.6em', borderBottom: '2px solid #009B3A', paddingBottom: '10px' }}>{section.title}</h2>
            <p style={{ marginBottom: '12px', textAlign: 'justify', fontSize: '1em' }}>{section.text}</p>
            <div style={{ fontSize: '0.85em', color: '#666', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
              Fonte: <a href={section.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'none' }}>{section.source}</a>
            </div>
          </div>
        ))}
      </div>

      <footer style={{ backgroundColor: '#f0f0f0', color: '#666', textAlign: 'center', padding: '20px', marginTop: '40px', fontSize: '0.9em', borderTop: '1px solid #ddd' }}>
        <p>&copy; 2026 Dexcom Sensor G7. Todos os direitos reservados.</p>
        <p>Página informativa sobre tecnologia CGM e sensores de glicose contínua.</p>
      </footer>
    </div>
  );
};

export default SafePage;