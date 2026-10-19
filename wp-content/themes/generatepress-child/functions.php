<?php
/**
 * GeneratePress Child Theme Functions — Ryokourent (Malang & Batu)
 *
 * Menerapkan D-01 & D-08: Enqueue stylesheet induk & child theme secara ringan.
 *
 * @package Ryokourent_Child_Theme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function ryokourent_child_enqueue_styles() {
	wp_enqueue_style(
		'generatepress-child-style',
		get_stylesheet_uri(),
		array(),
		'2.1.0'
	);
}
add_action( 'wp_enqueue_scripts', 'ryokourent_child_enqueue_styles', 20 );
