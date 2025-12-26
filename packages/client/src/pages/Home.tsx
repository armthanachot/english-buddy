import { Container, Grid, Typography } from '@mui/material'
import GlassCard from '../components/GlassCard'
import GlassCube from '../assets/GlassCube'
import WarmBlockCity from '../assets/WarmBlockCity'
import GlassDataCluster from '../assets/GlassDataCluster'
import TypepoCubeScene from '../assets/TypepoCubeScene'
import DocumentNetworkBook from '../assets/DocumentNetworkBook'

export default function Home() {
  return (
    <Container maxWidth="xl" sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 2,
    }}>
      <Grid container spacing={2} justifyContent="center"
        alignItems="center"
        sx={{ width: '100%' }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 6 }}>
          <GlassCard>
            <Typography variant="h3" component="h3">Translator</Typography>
            <Container sx={{height: '50px'}} />
            <GlassCube></GlassCube>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 6 }}>
          <GlassCard>
            <Typography variant="h3" component="h3">Situations</Typography>
            <Container sx={{height: '50px'}} />
            <WarmBlockCity></WarmBlockCity>
          </GlassCard>

        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 6 }}>

          <GlassCard>
            <Typography variant="h3" component="h3">Usage Explanation</Typography>
            <Container sx={{height: '50px'}} />
            <GlassDataCluster></GlassDataCluster>
          </GlassCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 6 }}>


          <GlassCard>
            <Typography variant="h3" component="h3">Keyword Detect</Typography>
            <Container sx={{height: '50px'}} />
            <TypepoCubeScene></TypepoCubeScene>
          </GlassCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 6 }}>

          <GlassCard>
            <Typography variant="h3" component="h3">File Translation</Typography>
            <Container sx={{height: '50px'}} />
            <DocumentNetworkBook></DocumentNetworkBook>
          </GlassCard>
        </Grid>


      </Grid>
    </Container>
  )
}
