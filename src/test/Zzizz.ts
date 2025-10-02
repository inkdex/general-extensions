
import { TestSuite, registerDefaultTests } from '@paperback/types'
import { Zzizz } from '../Zzizz/main'
import sourceInfo from '../Zzizz/pbconfig'

export async function runTests() {
  const suite = new TestSuite('Zzizz tests')
  registerDefaultTests(suite, Zzizz, sourceInfo)
  
  await suite.run()
}
                