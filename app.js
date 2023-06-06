const Jimp = require('jimp');
const inquirer = require('inquirer');

const addTextWatermarkToImage = async function(inputFile, outputFile, text) {
  const image = await Jimp.read(inputFile);
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  const textData = {
    text: text,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
  };

  image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
  await image.quality(100).writeAsync(outputFile);
};

const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile) {
  const image = await Jimp.read(inputFile);
  const watermark = await Jimp.read(watermarkFile);
  const x = image.getWidth() / 2 - watermark.getWidth() / 2;
  const y = image.getHeight() / 2 - watermark.getHeight() / 2;

  image.composite(watermark, x, y, {
    mode: Jimp.BLEND_SOURCE_OVER,
    opacitySource: 0.5,
  });
  await image.quality(100).writeAsync(outputFile);
};

const prepareOutputFilename = (filename) => {
  const [ name, ext ] = filename.split('.');
  return `${name}-with-watermark.${ext}`;
};

const editImage = async (imagePath) => {
  const image = await Jimp.read(imagePath);

  const editOptions = await inquirer.prompt([{
    name: 'edit',
    type: 'confirm',
    message: 'Do you want to edit the image?',
    default: false
  }]);

  if (!editOptions.edit) {
    return image;
  }

  const modifications = await inquirer.prompt([{
    name: 'modification',
    type: 'list',
    message: 'Choose a modification:',
    choices: [
      'Make image brighter',
      'Increase contrast',
      'Make image black and white',
      'Invert image'
    ]
  }]);

  if (modifications.modification === 'Make image brighter') {
    image.brightness(0.3);
  } else if (modifications.modification === 'Increase contrast') {
    image.contrast(0.3);
  } else if (modifications.modification === 'Make image black and white') {
    image.greyscale();
  } else if (modifications.modification === 'Invert image') {
    image.invert();
  }

  return image;
};

const startApp = async () => {

  // Ask if user is ready
  const answer = await inquirer.prompt([{
    name: 'start',
    message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
    type: 'confirm'
  }]);

  // if answer is no, just quit the app
  if (!answer.start) process.exit();

  // ask about input file
  const inputOptions = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg'
  }]);

  const editedImage = await editImage('./img/' + inputOptions.inputImage);

  // ask about watermark type
  const options = await inquirer.prompt([{
    name: 'watermarkType',
    type: 'list',
    choices: ['Text watermark', 'Image watermark']
  }]);

  if (options.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([{
      name: 'value',
      type: 'input',
      message: 'Type your watermark text:'
    }]);
    options.watermarkText = text.value;
    addTextWatermarkToImage(
      editedImage,
      './img/' + prepareOutputFilename(inputOptions.inputImage),
      options.watermarkText
    );
  } else {
    const image = await inquirer.prompt([{
      name: 'filename',
      type: 'input',
      message: 'Type your watermark name:',
      default: 'logo.png'
    }]);
    options.watermarkImage = image.filename;
    addImageWatermarkToImage(
      editedImage,
      './img/' + prepareOutputFilename(inputOptions.inputImage),
      './img/' + options.watermarkImage
    );
  }

};

startApp()