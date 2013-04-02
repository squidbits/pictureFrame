require 'rubygems'
require 'sinatra'
require 'sinatra/reloader'
require 'rmagick'
require 'erb'
require 'base64'


class PictureFrame < Sinatra::Base
	register Sinatra::Reloader

  helpers do
    def partial (template, locals = {})
      erb(template, :layout => false, :locals => locals)
    end
    
    def thumb_not_bigger(img,width,height)
      img.change_geometry("#{width}x#{height}") do |cols,rows,img|
        img.resize(cols,rows)
      end
    end
    
    def img(name)
      "<img src='#{name}' alt='#{name}' />" 
    end
    
    class Photo
      @file_path
    end
  end

	get '/' do
		haml :index
	end
  
  get '/upload' do
    haml :upload
  end
  
	post '/upload' do
    @photo = []
    #@photo.file_path = "public/uploads/#{params[:filename]}"
    File.open("public/uploads/#{params[:filename]}", 'w') do |f|
      f.puts Base64.decode64(params[:data])
    end
    
    img = Magick::Image.read("public/uploads/#{params[:filename]}").first
    thumb = thumb_not_bigger(img,500,500)
    thumb.write("public/uploads/thumb/500/#{params[:filename]}")
    thumb = thumb_not_bigger(img,300,300)
    thumb.write("public/uploads/thumb/300/#{params[:filename]}")
    thumb = thumb_not_bigger(img,100,100)
    thumb.write("public/uploads/thumb/100/#{params[:filename]}")
	end
  
  get '/gallery' do
    @photos = Dir["public/uploads/thumb/300/*"]
    @photos.each do |g|
      g.sub!("public/","")
    end
    haml :gallery
  end 
end