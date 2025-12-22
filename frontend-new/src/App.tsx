import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position='top-right' richColors />
      <div className='min-h-screen bg-background text-foreground'>
        <h1 className='text-3xl font-bold p-8'>Ayphen Textile - Frontend New</h1>
        <p className='px-8 text-muted-foreground'>shadcn/ui + Tailwind CSS Migration</p>
      </div>
    </>
  );
}

export default App;
