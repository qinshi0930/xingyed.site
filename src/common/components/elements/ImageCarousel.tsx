import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useWindowSize } from "usehooks-ts";

import Image from "./Image";

interface ImageCarouselProps {
	images: string[];
	interval?: number;
}

const ImageCarousel = ({ images, interval = 3000 }: ImageCarouselProps) => {
	const { width } = useWindowSize();
	const isMobile = width < 480;

	const getDeviceWidth = () => {
		let slidesToShow = 5;

		if (width < 480) {
			slidesToShow = 2;
		} else if (width <= 768) {
			slidesToShow = 4;
		}

		return slidesToShow;
	};

	return (
		<Swiper
			modules={[Autoplay]}
			spaceBetween={10}
			slidesPerView={getDeviceWidth()}
			loop={true}
			autoplay={{
				delay: interval,
				disableOnInteraction: false,
			}}
			className="pt-5"
			onSwiper={(swiper) => {
				const swiperElement = swiper.el;
				swiperElement.addEventListener("mouseenter", () => swiper.autoplay.stop());
				swiperElement.addEventListener("mouseleave", () => swiper.autoplay.start());
			}}
		>
			{images?.map((image, index) => (
				// eslint-disable-next-line react/no-array-index-key
				<SwiperSlide key={index}>
					<Image
						src={image}
						alt={`Image ${index + 1}`}
						width={isMobile ? 130 : 145}
						height={50}
						rounded="rounded-full"
						className="rounded-full bg-light px-3 hover:shadow-xl"
					/>
				</SwiperSlide>
			))}
		</Swiper>
	);
};

export default ImageCarousel;
