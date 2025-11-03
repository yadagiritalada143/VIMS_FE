import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateNewComponent } from './create-new.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { DatePipe } from '@angular/common';

describe('CreateNewComponent', () => {
  let component: CreateNewComponent;
  let fixture: ComponentFixture<CreateNewComponent>;
  CommonTestingModule.setUpTestBed(CreateNewComponent);
  let Date: Partial<DatePipe>;

  beforeEach(async () => {
    const datePipe= jasmine.createSpyObj('DatePipe', ['transform']);
    await TestBed.configureTestingModule({
      declarations: [ CreateNewComponent ],
      providers: [
        { provide : DatePipe , useValue: datePipe }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
