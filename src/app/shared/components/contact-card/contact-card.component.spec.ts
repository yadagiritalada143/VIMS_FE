import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ContactCardComponent } from './contact-card.component';

describe('ContactCardComponent', () => {
  let component: ContactCardComponent;
  let fixture: ComponentFixture<ContactCardComponent>;
  CommonTestingModule.setUpTestBed(ContactCardComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContactCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
