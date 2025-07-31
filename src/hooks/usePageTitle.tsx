import { useEffect } from 'react';

interface UsePageTitleProps {
  title?: string;
  barbershopName?: string;
  showBrand?: boolean;
}

const usePageTitle = ({ title, barbershopName, showBrand = true }: UsePageTitleProps = {}) => {
  useEffect(() => {
    const baseTitle = "Salão.ai - Seu salão inteligente!";
    
    let pageTitle = baseTitle;
    
    if (title && barbershopName) {
      pageTitle = `${title} | ${barbershopName} | ${baseTitle}`;
    } else if (barbershopName && !title) {
      pageTitle = `${barbershopName} | ${baseTitle}`;
    } else if (title && !barbershopName) {
      pageTitle = showBrand ? `${title} | ${baseTitle}` : title;
    }
    
    document.title = pageTitle;
  }, [title, barbershopName, showBrand]);
};

export default usePageTitle;