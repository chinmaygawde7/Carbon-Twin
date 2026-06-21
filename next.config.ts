import type { NextConfig } from 'next'
import withBundleAnalyzerInit from '@next/bundle-analyzer'

const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  /* existing config options, if any, stay here */
}

export default withBundleAnalyzer(nextConfig)
