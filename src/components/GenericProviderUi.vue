<script>
export default {
	props: {
		providerManager: Object,
		busy: Boolean,
		databases: Array,
		error: String,
		loggedIn: Boolean,
		toggleLogin: Function,
		removeable: Boolean,
		removeFunction: Function
	}
};
</script>

<template>
	<div>
		<div class="between">
			<div class="title">
				<span>
					<svg class="icon" viewBox="0 0 1 1">
						<use v-bind="{'xlink:href':'#'+providerManager.icon}"></use>
					</svg>
					{{ providerManager.chooseTitle }}
				</span>
				<span class="error pill" v-show="error.length">{{error}}</span>
				<span v-for="(db, index) in databases" class="chip">
					{{ db.title }}
					<i v-if="removeable" class="fa fa-times-circle selectable" aria-hidden="true" @click="removeFunction(index)"></i>
				</span>
			</div>
			<div>
				<div class="switch">
					<label>
						<input :disabled="busy" type="checkbox" :checked="loggedIn" @click="toggleLogin">
						<span class="lever"></span>
					</label>
				</div>
			</div>
		</div>
		<div class="description">{{ providerManager.chooseDescription }}</div>
	</div>
</template>