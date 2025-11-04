let filterInstance = null;

const createFilter = async () => {
  try {
    const BadWordsModule = await import('bad-words');
    const BadWords = BadWordsModule.default || BadWordsModule.Filter || BadWordsModule;
    
    const filter = new BadWords();

    const additionalBadWords = [
      // Add custom words here
    ];
    
    if (additionalBadWords.length > 0) {
      filter.addWords(...additionalBadWords);
    }

    // Custom placeholder
    filter.replaceRegex = /[A-Za-z0-9가-힣]/g;
    filter.placeholder = '*';

    return filter;
  } catch (error) {
    console.error('Error creating bad words filter:', error);
    throw error;
  }
}

const filterBadWords = async (text) => {
  if (!text) return text;
  
  try {
    if (!filterInstance) {
      filterInstance = await createFilter();
    }
    return filterInstance.clean(text);
  } catch (error) {
    console.error('Error filtering bad words:', error);
    return text;
  }
}

module.exports = filterBadWords;