import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { HiCheckCircle, HiXCircle, HiOutlineClipboardList } from 'react-icons/hi';

const OrderConfirmation = () => {
  const [params] = useSearchParams();
  const status = params.get('status') || 'success';
  const isSuccess = status === 'success' || status === 'approved';

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="card max-w-md w-full p-10 text-center animate-fade-in">
        {isSuccess ? (
          <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        ) : (
          <HiXCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        )}

        <h1 className="text-2xl font-bold mb-2">
          {isSuccess ? '¡Pedido realizado!' : 'Error en el pago'}
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          {isSuccess
            ? 'Recibirás un email de confirmación con los detalles de tu pedido.'
            : 'Hubo un problema al procesar tu pago. Podés intentarlo nuevamente.'}
        </p>

        <div className="flex flex-col gap-3">
          {isSuccess && (
            <Link to="/mis-ordenes" className="btn-primary flex items-center justify-center gap-2">
              <HiOutlineClipboardList size={18} />
              Ver mis pedidos
            </Link>
          )}
          <Link to="/productos" className="btn-secondary">
            {isSuccess ? 'Seguir comprando' : 'Volver al inicio'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
