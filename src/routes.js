// Options
import OptionsStartup from '@/components/OptionsStartup'
import ManageDatabases from '@/components/ManageDatabases/ManageDatabases'
import HelpMeChoose from '@/components/ManageDatabases/HelpMeChoose'
import CreateNewDatabase from '@/components/ManageDatabases/CreateNewDatabase'
import ManageKeyfiles from '@/components/ManageKeyfiles'
import AdvancedSettings from '@/components/AdvancedSettings'
import Reauthorize from '@/components/Reauthorize'
// Popups
import Startup from '@/components/Startup.vue'
import FilePicker from '@/components/FilePicker.vue'
import Unlock from '@/components/Unlock.vue'
import EntryDetails from '@/components/EntryDetails.vue'
import { Links } from '$services/links'

const links = new Links()

const options_routes = [
	{
		path: '/',
		name: 'Getting Started',
		component: OptionsStartup
	},
	{
		path: '/manage/databases',
		name: 'Database Sources',
		component: ManageDatabases,
		children: [
			{
				path: 'help',
				component: HelpMeChoose,
			},
			{
				path: 'new',
				component: CreateNewDatabase,
			},
		],
	},
	{
		path: '/manage/keyfiles',
		name: 'Keyfiles',
		component: ManageKeyfiles
	},
	{
		path: '/advanced',
		name: 'Advanced Settings',
		component: AdvancedSettings
	},
	{
		path: '/reauthorize/:provider',
		name: 'Reauthorize',
		component: Reauthorize,
		hidden: true,
	},
	{
		path: '*',
		redirect: '/',
		hidden: true,
	},
]

const popup_routes = [
	{
		path: '/',
		component: Startup,
		props: { links },
	},
	{
		path: '/choose',
		component: FilePicker,
		props: { links },
	},
	{
		path: '/unlock/:provider/:title',
		component: Unlock,
		props: { links },
	},
	{
		path: '/details/:entry_id',
		component: EntryDetails,
		props: { links },
	},
	{
		path: '*',
		redirect: '/',
	},
]

export {
	options_routes,
	popup_routes,
}