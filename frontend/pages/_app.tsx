import { AppProps  } from 'next/app'
import '../styles/main.css'

export default function CelebrityApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
