import VirtualRouter from './virtual-router';

const router = new VirtualRouter()
const useRouter = () => {
	return router;
};

export { useRouter, router };