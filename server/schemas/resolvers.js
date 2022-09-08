const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
      me: async (parent, args, context) => {
        if (context.user) {
          return User.findOne({ _id: context.user._id }).populate('savedBooks');
        };
        throw new AuthenticationError('Please log in first!');
      },
    },
  
    Mutation: {
      login: async (parent, { email, password }) => {
        const user = await User.findOne({ email });
        if (!user) {
          throw new AuthenticationError('No user found with given email');
        };
  
        const correctPw = await user.isCorrecctPassword(password);
        if (!correctPw) {
          throw new AuthenticationError('Incorrect password');
        };
  
        const token = signToken(user);
        return { token, user };
      },
  
      addUser: async (parent, { username, email, password }) => {
        const user = await User.create({ username, email, password });
        const token = signToken(user);
        return { token, user };
      },
  
      saveBook: async (parent, { bookId, authors, description, image, link }, context) => {
        if (context.user) {
          const book = await Book.create({
            bookId,
            authors,
            description,
            image,
            link
          });
  
          await User.findOneAndUpdate(
            { _id: context.user._id },
            { $addToSet: { savedBooks: book }}
          )
        }
      },
      
      removeBook: async (parent, { bookId }, context) => {
        if (context.user) {
          const book = await Book.findOneAndDelete({
            bookId: bookId
          });
          
          await User.findOneAndUpdate(
              { _id: context.user._id },
              { $pull: { savedBooks: book.bookId }}
          );
  
          return book;
        };
        throw new AuthenticationError('You must log in first!')
      },
    },
};
  

