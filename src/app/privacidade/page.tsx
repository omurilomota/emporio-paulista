import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { LogoMark, LogoWordmark } from "@/components/logo";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como o Empório Paulista usa os dados necessários para atender seu pedido.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const updated = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="privacy-page">
      <header className="privacy-header"><Link className="logo-link" href="/"><LogoMark size={38} /><LogoWordmark /></Link><Link className="privacy-back" href="/"><ArrowLeft size={14} /> Voltar à vitrine</Link></header>
      <article className="privacy-content"><span className="privacy-icon"><ShieldCheck size={21} /></span><p className="privacy-kicker">Empório Paulista · LGPD</p><h1>Política de privacidade</h1><p className="privacy-updated">Última atualização: {updated}</p><p className="privacy-intro">Usamos seus dados apenas para receber, preparar e entregar o pedido que você fez. Não vendemos nem compartilhamos listas de clientes.</p>
        <section><h2>Quem é responsável</h2><p>O tratamento dos dados para pedidos é realizado por <strong>Restaurante Exemplo LTDA – ME</strong>, CNPJ 00.000.000/0001-00, com endereço na Rua das Acácias, 120, Centro, Junqueirópolis/SP, CEP 00000-000. Esta página descreve o uso de dados na vitrine Empório Digital.</p></section>
        <section><h2>Quais dados pedimos e por quê</h2><ul><li><strong>Nome e telefone:</strong> identificar seu pedido e falar com você sobre confirmação, preparo ou entrega.</li><li><strong>Endereço:</strong> somente quando você escolher receber por entrega.</li><li><strong>Itens e observações:</strong> preparar seu pedido conforme as escolhas que você informou.</li><li><strong>Forma de pagamento:</strong> organizar o recebimento na entrega ou na retirada. Este site não processa nem armazena número de cartão, senha ou credenciais bancárias.</li></ul><p>Pedidos e registros de consentimento ficam armazenados no banco de dados da operação para que a equipe consiga atendê-los e manter os registros comerciais necessários.</p></section>
        <section><h2>Com quem compartilhamos</h2><p>Os dados do pedido ficam disponíveis à equipe que o prepara e atende. Ao escolher falar pelo WhatsApp, você também utiliza os serviços e a política de privacidade do próprio WhatsApp. O site não vende nem aluga seus dados pessoais para publicidade.</p></section>
        <section><h2>Seu controle e seus direitos</h2><p>Você pode pedir confirmação do uso, acesso, correção ou exclusão dos dados que não precisem ser mantidos por obrigações legais. Também pode retirar seu consentimento para usos baseados nele. Para fazer uma solicitação, fale com a equipe pelo WhatsApp oficial.</p><a className="privacy-contact" href="https://wa.me/5518999990102?text=Ol%C3%A1%2C%20quero%20falar%20sobre%20meus%20dados%20pessoais" target="_blank" rel="noreferrer"><MessageCircle size={15} /> (18) 99999-0102 · solicitar atendimento</a></section>
        <section><h2>Segurança e atualizações</h2><p>Adotamos controles para que as informações sejam acessadas apenas na rotina de atendimento. Nenhum sistema conectado à internet pode prometer risco zero; se precisar falar sobre a segurança ou a privacidade de um pedido, entre em contato. Esta política pode mudar quando os serviços mudarem; a data no topo mostra a versão atual.</p></section>
        <div className="privacy-summary"><ShieldCheck size={17} /><span><strong>Seu consentimento vale para este pedido.</strong><small>Na finalização, autorizamos apenas o uso dos dados necessários para confirmar e atender a compra que você escolheu.</small></span></div>
        <div className="privacy-address"><MapPin size={14} /> Empório Paulista · Junqueirópolis, SP</div>
      </article>
      <footer className="privacy-footer"><span>© {new Date().getFullYear()} Empório Paulista</span><Link href="/">Voltar ao cardápio <ArrowLeft size={12} /></Link><a className="privacy-credit" href="https://wa.me/5518998133524" target="_blank" rel="noreferrer" aria-label="Falar com Murilo Mota no WhatsApp">Desenvolvido por Murilo Mota · 55 (18) 99813-3524</a></footer>
    </main>
  );
}
